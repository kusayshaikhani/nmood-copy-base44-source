import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, GripVertical, Shield } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const defaultRules = ['Be respectful', 'No spam', 'Stay on topic'];

/**
 * UI-021 — Circle Step 4: Rules as editable, reorderable cards.
 * Add / remove / reorder rules with drag handles via @hello-pangea/dnd.
 */
export default function CircleStepRules({ data, update }) {
  const { t } = useLocalization();
  const rules = data.rules && data.rules.length > 0 ? data.rules : defaultRules;
  const [newRule, setNewRule] = useState('');

  const ensureRules = () => {
    if (!data.rules || data.rules.length === 0) {
      update('rules', [...defaultRules]);
    }
  };

  // Initialize default rules once on mount
  React.useEffect(ensureRules, []);

  const addRule = () => {
    const rule = newRule.trim();
    if (!rule || rules.includes(rule)) return;
    update('rules', [...rules, rule]);
    setNewRule('');
  };

  const removeRule = (index) => {
    update('rules', rules.filter((_, i) => i !== index));
  };

  const editRule = (index, value) => {
    update('rules', rules.map((r, i) => (i === index ? value : r)));
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(rules);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    update('rules', reordered);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{t('create.circle.rules_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('create.circle.rules_subtitle')}</p>
      </div>

      {/* Rules list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="circle-rules">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {rules.map((rule, index) => (
                <Draggable key={`rule-${index}`} draggableId={`rule-${index}`} index={index}>
                  {(dragProvided, snapshot) => (
                    <motion.div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: snapshot.isDragging ? 1.02 : 1,
                        boxShadow: snapshot.isDragging
                          ? '0 8px 24px rgba(36,21,109,0.15)'
                          : 'var(--shadow-soft)',
                      }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 p-4 rounded-card border border-border/50 bg-card"
                      style={{
                        ...dragProvided.draggableProps.style,
                        cursor: 'grab',
                      }}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => editRule(index, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-medium outline-none border-none min-w-0"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRule(index); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        type="button"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add new rule */}
      <div className="flex gap-2">
        <input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRule(); } }}
          placeholder={t('create.circle.rules_add_placeholder')}
          className="flex-1 h-12 px-4 rounded-button bg-card border border-border text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={addRule}
          type="button"
          disabled={!newRule.trim()}
          className="h-12 px-5 rounded-button bg-primary text-primary-foreground flex items-center gap-1.5 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> {t('create.circle.rules_add')}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-card bg-muted/20 border border-border">
        <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t('create.circle.rules_hint')}</p>
      </div>
    </div>
  );
}